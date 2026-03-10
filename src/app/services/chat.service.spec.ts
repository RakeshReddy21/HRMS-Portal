import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChatService } from './chat.service';
import { environment } from '../../environments/environment';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ChatService]
    });

    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get conversations', () => {
    const mockResponse = {
      success: true,
      data: []
    };

    service.getConversations().subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/chat/conversations`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get messages', () => {
    const mockResponse = {
      success: true,
      data: {
        content: [],
        totalElements: 0
      }
    };

    service.getMessages(1, { page: 0, size: 10 }).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(req => req.url.includes('/chat/conversations/1/messages'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should send message', () => {
    const messageRequest = {
      conversationId: 1,
      message: 'Hello'
    };
    const mockResponse = {
      success: true,
      data: {
        messageId: 1
      }
    };

    service.sendMessage(messageRequest).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/chat/messages`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});

