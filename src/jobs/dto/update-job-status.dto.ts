import { IsEnum } from 'class-validator';
import { JobStatus } from '../../common/enums';

export class UpdateJobStatusDto {
  @IsEnum(JobStatus)
  status: JobStatus;
}
