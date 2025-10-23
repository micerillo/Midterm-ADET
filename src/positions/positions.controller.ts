import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { PositionsService } from './positions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.positionsService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':position_id')
  async getOne(@Param('position_id') position_id: string) {
    return this.positionsService.findById(+position_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: any, @Req() req: Request) {
    const { position_code, position_name } = body;
    const user = req.user as any;

    if (!position_code || !position_code.trim()) {
      throw new BadRequestException('Position code is required.');
    }
    if (!position_name || !position_name.trim()) {
      throw new BadRequestException('Position name is required.');
    }
    if (!user || !user.id) {
      throw new BadRequestException('User info missing from token.');
    }

    return this.positionsService.createPosition(
      position_code,
      position_name,
      user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':position_id')
  async update(
    @Param('position_id') position_id: string,
    @Body() body: any,
  ) {
    return this.positionsService.updatePosition(+position_id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':position_id')
  async remove(@Param('position_id') position_id: string) {
    return this.positionsService.deletePosition(+position_id);
  }
}
