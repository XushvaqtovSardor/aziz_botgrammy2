import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller('admin')
export class AdminPageController {
    @Get()
    getLoginPage(@Res() res: Response) {
        return res.sendFile(join(__dirname, '..', '..', '..', 'public', 'admin', 'index.html'));
    }

    @Get('dashboard')
    getDashboardPage(@Res() res: Response) {
        return res.sendFile(join(__dirname, '..', '..', '..', 'public', 'admin', 'dashboard.html'));
    }

    @Get('dashboard.html')
    getDashboardPageWithExtension(@Res() res: Response) {
        return res.sendFile(join(__dirname, '..', '..', '..', 'public', 'admin', 'dashboard.html'));
    }

    @Get('dashboard.css')
    getDashboardCss(@Res() res: Response) {
        res.setHeader('Content-Type', 'text/css');
        return res.sendFile(join(__dirname, '..', '..', '..', 'public', 'admin', 'dashboard.css'));
    }

    @Get('dashboard.js')
    getDashboardJs(@Res() res: Response) {
        res.setHeader('Content-Type', 'application/javascript');
        return res.sendFile(join(__dirname, '..', '..', '..', 'public', 'admin', 'dashboard.js'));
    }
}
