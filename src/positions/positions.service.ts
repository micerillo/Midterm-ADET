import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OkPacket, RowDataPacket } from 'mysql2';

@Injectable()
export class PositionsService {
  constructor(private db: DatabaseService) {}

  private pool() {
    return this.db.getPool();
  }

  async createPosition(
    position_code: string,
    position_name: string,
    user_id: number,
  ) {
    if (!position_code?.trim()) {
      throw new Error('Position code is required and cannot be empty.');
    }
    if (!position_name?.trim()) {
      throw new Error('Position name is required and cannot be empty.');
    }

    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO positions (position_code, position_name, user_id) VALUES (?, ?, ?)',
      [position_code.trim(), position_name.trim(), user_id],
    );

    return {
      position_id: result.insertId,
      position_code,
      position_name,
      user_id,
    };
  }

  async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT position_id, position_code, position_name, user_id, created_at, updated_at FROM positions',
    );
    return rows;
  }

  async findById(position_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT position_id, position_code, position_name, user_id, created_at, updated_at FROM positions WHERE position_id = ?',
      [position_id],
    );

    if (rows.length === 0) {
      throw new NotFoundException(`Position with ID ${position_id} not found`);
    }

    return rows[0];
  }

  async updatePosition(
    position_id: number,
    partial: { position_code?: string; position_name?: string },
  ) {
    const fields = [];
    const values = [];

    if (partial.position_code !== undefined) {
      fields.push('position_code = ?');
      values.push(partial.position_code.trim());
    }

    if (partial.position_name !== undefined) {
      fields.push('position_name = ?');
      values.push(partial.position_name.trim());
    }

    if (fields.length === 0) {
      return this.findById(position_id);
    }

    values.push(position_id);

    await this.pool().execute(
      `UPDATE positions SET ${fields.join(', ')} WHERE position_id = ?`,
      values,
    );

    return this.findById(position_id);
  }

  async deletePosition(position_id: number) {
    const [result] = await this.pool().execute<OkPacket>(
      'DELETE FROM positions WHERE position_id = ?',
      [position_id],
    );

    return result.affectedRows === 1;
  }
}
