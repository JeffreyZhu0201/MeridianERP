import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlatformAdminDto } from './dto/create-platform-admin.dto';
import { UpdatePlatformAdminDto } from './dto/update-platform-admin.dto';

@Injectable()
export class PlatformAdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const admins = await this.prisma.platformUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return admins;
  }

  async create(dto: CreatePlatformAdminDto) {
    const existing = await this.prisma.platformUser.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Admin with this email already exists');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const admin = await this.prisma.platformUser.create({
      data: {
        email: dto.email,
        password,
        role: dto.role as PlatformRole,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return admin;
  }

  async update(id: string, dto: UpdatePlatformAdminDto, actorId: string) {
    const admin = await this.prisma.platformUser.findUnique({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (dto.role !== undefined && admin.role === PlatformRole.SUPER_ADMIN) {
      const superAdminCount = await this.prisma.platformUser.count({
        where: { role: PlatformRole.SUPER_ADMIN },
      });
      if (superAdminCount <= 1 && dto.role !== PlatformRole.SUPER_ADMIN) {
        throw new BadRequestException('Cannot demote the last super admin');
      }
    }

    const data: { role?: PlatformRole; password?: string } = {};
    if (dto.role !== undefined) {
      data.role = dto.role as PlatformRole;
    }
    if (dto.password !== undefined) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.platformUser.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) {
      throw new ForbiddenException('Cannot delete your own admin account');
    }

    const admin = await this.prisma.platformUser.findUnique({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.role === PlatformRole.SUPER_ADMIN) {
      const superAdminCount = await this.prisma.platformUser.count({
        where: { role: PlatformRole.SUPER_ADMIN },
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException('Cannot delete the last super admin');
      }
    }

    await this.prisma.platformUser.delete({ where: { id } });
    return { deleted: true };
  }
}
