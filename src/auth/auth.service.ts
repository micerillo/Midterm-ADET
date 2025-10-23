import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService, private jwtService: JwtService) {}

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findByUsername(username);
        if (!user) return null;

        const isValid = await bcrypt.compare(pass, user.password);
        if (isValid) {
            const { id, username, role } = user;
            return { id, username, role };
        }
        return null;
    }

    async login(user: { id: number; username: string; role: string }) {
        const payload = { sub: user.id, username: user.username, role: user.role };
        const accessToken = this.jwtService.sign(payload);

        // create refresh token using a separate secret so you can revoke access by changing refresh secret
        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret',
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '10d',
        });

        // store refresh token in db (plain text or hashed)
        // for better security, hash the token before storing. Here we'll store plain for simplicity.
        await this.usersService.setRefreshToken(user.id, refreshToken);

        return { accessToken, refreshToken };
    }

    async logout(userId: number) {
        await this.usersService.setRefreshToken(userId, null);
        return { ok: true };
    }

    async refreshTokens(refreshToken: string) {
        try {
            const decoded = await this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret',
            });
            if (!decoded) throw new UnauthorizedException('Invalid refresh token');

            // check stored token matches
            const user = await this.usersService.findById(decoded.sub);
            const found = await this.usersService.findByRefreshToken(refreshToken);
            if (!found) {
                // we need to stored refresh token...
                // Instead of creating calls, let's assume it catches refresh token
                // const found = await this.usersService.findByRefreshToken(refreshToken);
                if (!found) throw new UnauthorizedException('Invalid refresh token (not found)');
            }

            const payload = { sub: found.id, username: found.username, role: found.role };
            const accessToken = this.jwtService.sign(payload);
            const newRefreshToken = this.jwtService.sign(payload, {
                secret: process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret',
                expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '10d',
            });

            await this.usersService.setRefreshToken(found.id, newRefreshToken);
            return { accessToken, refreshToken: newRefreshToken };
        } catch (err) {
            throw new UnauthorizedException('Could not refresh tokens');
        }
    }
}