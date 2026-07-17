import { Equals, IsString } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @Equals('DELETE')
  confirmation!: 'DELETE';
}
