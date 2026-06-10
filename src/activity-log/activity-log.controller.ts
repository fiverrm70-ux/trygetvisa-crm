import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityLogService } from './activity-log.service';

type AuthRequest = Request & {
  user: {
    id?: number;
    sub?: number;
    userId?: number;
    email: string;
    role: string;
  };
};

type ActivityNoteDto = {
  note?: string;
};

@Controller('activity-log')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  private getAuthUser(req: AuthRequest) {
    const userId = req.user.userId ?? req.user.id ?? req.user.sub;

    if (!userId) {
      throw new UnauthorizedException('Invalid user token');
    }

    return {
      userId,
      email: req.user.email,
      role: req.user.role,
    };
  }

  @Post('login')
  login(@Req() req: AuthRequest, @Body() body: ActivityNoteDto) {
    return this.activityLogService.createActivity(
      this.getAuthUser(req),
      ActivityType.LOGIN,
      body.note,
    );
  }

  @Post('break-start')
  breakStart(@Req() req: AuthRequest, @Body() body: ActivityNoteDto) {
    return this.activityLogService.createActivity(
      this.getAuthUser(req),
      ActivityType.BREAK_START,
      body.note,
    );
  }

  @Post('break-end')
  breakEnd(@Req() req: AuthRequest, @Body() body: ActivityNoteDto) {
    return this.activityLogService.createActivity(
      this.getAuthUser(req),
      ActivityType.BREAK_END,
      body.note,
    );
  }

  @Post('lunch-start')
  lunchStart(@Req() req: AuthRequest, @Body() body: ActivityNoteDto) {
    return this.activityLogService.createActivity(
      this.getAuthUser(req),
      ActivityType.LUNCH_START,
      body.note,
    );
  }

  @Post('lunch-end')
  lunchEnd(@Req() req: AuthRequest, @Body() body: ActivityNoteDto) {
    return this.activityLogService.createActivity(
      this.getAuthUser(req),
      ActivityType.LUNCH_END,
      body.note,
    );
  }

  @Post('logout')
  logout(@Req() req: AuthRequest, @Body() body: ActivityNoteDto) {
    return this.activityLogService.createActivity(
      this.getAuthUser(req),
      ActivityType.LOGOUT,
      body.note,
    );
  }

  @Get('me/today')
  getMyTodayActivity(@Req() req: AuthRequest) {
    return this.activityLogService.getMyTodayActivity(this.getAuthUser(req));
  }

  @Get('today-report')
  getTodayAttendanceReport() {
    return this.activityLogService.getTodayAttendanceReport();
  }
}
