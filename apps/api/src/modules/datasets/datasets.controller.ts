import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { DatasetsService } from './datasets.service';
import { parseFileBuffer } from './dataset-parser.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenantId } from '../../common/decorators/current-user.decorator';

const MAX_FILE_MB = 25;

@ApiTags('datasets')
@Controller('datasets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DatasetsController {
  constructor(private datasetsService: DatasetsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a CSV or Excel file and create a dataset' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = /\.(csv|tsv|txt|xlsx|xls)$/i.test(file.originalname);
        cb(ok ? null : new Error('Only .csv, .tsv, .xlsx, .xls files are allowed'), ok);
      },
    }),
  )
  async upload(
    @CurrentTenantId() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name?: string,
  ) {
    if (!file) {
      return { error: 'No file uploaded' };
    }
    const sourceType = /\.(xlsx|xls)$/i.test(file.originalname) ? 'excel' : 'csv';
    const parsed = parseFileBuffer(file.buffer, file.originalname);
    const datasetName = (name && name.trim()) || file.originalname;
    const dataset = await this.datasetsService.create(tenantId, {
      name: datasetName,
      sourceType,
      originalFilename: file.originalname,
      parsed,
    });
    return {
      id: dataset.id,
      name: dataset.name,
      columns: dataset.columns,
      rowCount: dataset.row_count,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List datasets for current tenant' })
  async findAll(@CurrentTenantId() tenantId: string) {
    return this.datasetsService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dataset metadata' })
  @ApiParam({ name: 'id', description: 'Dataset UUID' })
  async findOne(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.datasetsService.findOne(tenantId, id);
  }

  @Get(':id/rows')
  @ApiOperation({ summary: 'Get parsed rows (paginated) for a dataset' })
  @ApiParam({ name: 'id', description: 'Dataset UUID' })
  async getRows(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Query('limit') limit = '200',
    @Query('offset') offset = '0',
  ) {
    const rows = await this.datasetsService.getRows(
      tenantId,
      id,
      Math.min(parseInt(limit, 10) || 200, 1000),
      parseInt(offset, 10) || 0,
    );
    return rows;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a dataset' })
  @ApiParam({ name: 'id', description: 'Dataset UUID' })
  async remove(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    await this.datasetsService.remove(tenantId, id);
  }
}
