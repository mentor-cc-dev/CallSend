import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateTemplateDto {
  organizationId: string;
  branchId?: string;
  title: string;
  messageText: string;
  cardTitle?: string;
  cardDescription?: string;
  cardImageUrl?: string;
  price?: number;
  ctaTelegramLink?: string;
  ctaMapsLink?: string;
  isAutoPilotDefault?: boolean;
}

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, branchId?: string) {
    return this.prisma.template.findMany({
      where: {
        organizationId,
        OR: [
          { branchId: null },
          { branchId: branchId || undefined },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateTemplateDto) {
    if (dto.isAutoPilotDefault) {
      // Unset previous auto pilot default
      await this.prisma.template.updateMany({
        where: { organizationId: dto.organizationId, isAutoPilotDefault: true },
        data: { isAutoPilotDefault: false },
      });
    }

    return this.prisma.template.create({
      data: {
        organizationId: dto.organizationId,
        branchId: dto.branchId || null,
        title: dto.title,
        messageText: dto.messageText,
        cardTitle: dto.cardTitle,
        cardDescription: dto.cardDescription,
        cardImageUrl: dto.cardImageUrl,
        price: dto.price,
        ctaTelegramLink: dto.ctaTelegramLink,
        ctaMapsLink: dto.ctaMapsLink,
        isAutoPilotDefault: !!dto.isAutoPilotDefault,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.template.delete({ where: { id } });
  }
}
