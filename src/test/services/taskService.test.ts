import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase auth to always return a session with a token
vi.mock('../../lib/supabaseClient', () => ({
  default: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } } })
    }
  }
}));

// Import after mocks
import { taskService } from '../../services/taskService';

describe('taskService.updateTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should NOT call backend when updates have no mappable fields (timeTracking-only)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    } as any);
    (globalThis as any).fetch = fetchMock;

    const res = await taskService.updateTask('123', {
      // timeTracking is not persisted in backend; should be skipped
      timeTracking: {
        totalTimeSpent: 1000,
        isActive: true,
        lastStarted: Date.now(),
        timeEntries: []
      }
    } as any);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(res).toHaveProperty('message');
  });

  it('should call backend when updating mappable fields (e.g., status)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        task: {
          id: 123,
          user_id: 'u-1',
          title: 'T',
          description: '',
          status: 'In Progress',
          parent_id: null,
          created_at: new Date().toISOString(),
          due_date: null
        }
      })
    } as any);
    (globalThis as any).fetch = fetchMock;

    const res = await taskService.updateTask('123', { status: 'In Progress' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/tasks\/123$/);
    expect((init as RequestInit).method).toBe('PUT');
    expect((init as RequestInit).body as string).toContain('"status":"In Progress"');
    expect(res).toHaveProperty('data');
  });

  it('should POST a single summary on recordTimeSummary', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ entry: { id: 123 } })
    } as any);
    (globalThis as any).fetch = fetchMock;

    const res = await taskService.recordTimeSummary('42', 7777);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/time-entries\/complete$/);
    expect((init as RequestInit).method).toBe('POST');
    expect(String((init as RequestInit).body)).toContain('"task_id":42');
    expect(String((init as RequestInit).body)).toContain('"duration_ms":7777');
    expect(res).toHaveProperty('data');
  });
});
