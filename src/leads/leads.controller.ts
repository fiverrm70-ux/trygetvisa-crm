import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { BulkAssignLeadsDto } from './dto/bulk-assign-leads.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateProcessUpdateDto } from './dto/create-process-update.dto';
import { CreateSalesFollowUpDto } from './dto/create-sales-follow-up.dto';
import { UpdateProcessDocumentDto } from './dto/update-process-document.dto';
import { LeadsService } from './leads.service';

type AuthRequest = Request & {
  user: {
    userId?: number;
    id?: number;
    email: string;
    role: string;
  };
};

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  private getAuthUser(req: AuthRequest) {
    const userId = req.user.userId ?? req.user.id;

    if (!userId) {
      throw new InternalServerErrorException('Logged-in user id missing');
    }

    return {
      userId,
      email: req.user.email,
      role: req.user.role,
    };
  }

  @Post()
  create(@Body() createLeadDto: CreateLeadDto, @Req() req: AuthRequest) {
    return this.leadsService.create(createLeadDto, this.getAuthUser(req));
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.leadsService.findAll(this.getAuthUser(req));
  }

  @Post('upload-document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/process-documents',
        filename: (_req, file, callback) => {
          const uniqueName = `${Date.now()}-${Math.round(
            Math.random() * 1_000_000_000,
          )}${extname(file.originalname)}`;

          callback(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'Only PDF, image, DOC and DOCX files are allowed',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadProcessDocument(@UploadedFile() file: any, @Req() req: AuthRequest) {
    this.getAuthUser(req);

    if (!file) {
      throw new BadRequestException('Please upload a document');
    }

    const fileUrl = `/uploads/process-documents/${file.filename}`;
    const fullUrl = `http://localhost:5000${fileUrl}`;

    return {
      message: 'Document uploaded successfully',
      fileName: file.originalname,
      fileUrl,
      fullUrl,
    };
  }

  @Patch('bulk-assign/auto-distribute')
  bulkAssignAutoDistribute(
    @Body() bulkAssignDto: BulkAssignLeadsDto,
    @Req() req: AuthRequest,
  ) {
    return this.leadsService.bulkAssignAutoDistribute(
      bulkAssignDto,
      this.getAuthUser(req),
    );
  }

  @Post(':id/sales-follow-up')
  createSalesFollowUp(
    @Param('id') id: string,
    @Body() dto: CreateSalesFollowUpDto,
    @Req() req: AuthRequest,
  ) {
    return this.leadsService.createSalesFollowUp(
      Number(id),
      dto,
      this.getAuthUser(req),
    );
  }

  @Post(':id/process-update')
  createProcessUpdate(
    @Param('id') id: string,
    @Body() dto: CreateProcessUpdateDto,
    @Req() req: AuthRequest,
  ) {
    return this.leadsService.createProcessUpdate(
      Number(id),
      dto,
      this.getAuthUser(req),
    );
  }

  @Post(':id/process-document')
  updateProcessDocument(
    @Param('id') id: string,
    @Body() dto: UpdateProcessDocumentDto,
    @Req() req: AuthRequest,
  ) {
    return this.leadsService.updateProcessDocument(
      Number(id),
      dto,
      this.getAuthUser(req),
    );
  }

  @Patch(':id/assign')
  assignLead(
    @Param('id') id: string,
    @Body() assignLeadDto: AssignLeadDto,
    @Req() req: AuthRequest,
  ) {
    return this.leadsService.assignLead(
      Number(id),
      assignLeadDto,
      this.getAuthUser(req),
    );
  }
}
