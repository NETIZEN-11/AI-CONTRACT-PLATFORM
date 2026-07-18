import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  const sendMock = jest.fn().mockResolvedValue({});
  const getSignedUrlMock = jest.fn().mockResolvedValue('https://signed-url.example.com');

  beforeEach(async () => {
    sendMock.mockClear();
    getSignedUrlMock.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => {
              const values: Record<string, string> = {
                AWS_REGION: 'us-east-1',
                AWS_S3_BUCKET: 'test-bucket',
                AWS_ACCESS_KEY_ID: 'key',
                AWS_SECRET_ACCESS_KEY: 'secret',
              };
              return values[key] ?? fallback;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    // Inject a mocked S3Client onto the service so we don't actually call AWS.
    (service as unknown as { s3Client: { send: jest.Mock; } }).s3Client = {
      send: sendMock,
    };
    (service as unknown as { getSignedUrl: () => Promise<string> }).getSignedUrl = getSignedUrlMock;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fileExists', () => {
    it('should return true when S3 HeadObject succeeds', async () => {
      sendMock.mockResolvedValueOnce({});
      const result = await service.fileExists('some/key');
      expect(result).toBe(true);
    });

    it('should return false when S3 HeadObject fails', async () => {
      sendMock.mockRejectedValueOnce(new Error('NotFound'));
      const result = await service.fileExists('missing/key');
      expect(result).toBe(false);
    });
  });

  describe('deleteFile', () => {
    it('should call S3 delete and not throw on success', async () => {
      sendMock.mockResolvedValueOnce({});
      await expect(service.deleteFile('some/key')).resolves.toBeUndefined();
      expect(sendMock).toHaveBeenCalled();
    });
  });
});
