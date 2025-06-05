const { __MONGODB_URI_SET__ } = vi.hoisted(() => {
  process.env.MONGODB_URI = 'mongodb://mock-uri';
  return { __MONGODB_URI_SET__: true };
});

import { describe, it, expect, vi } from 'vitest';
import { GET, POST } from '../../../../app/api/admin/categories/route';
import { CategoryConfigService } from '../../../../lib/services/server/category-config-service';

vi.mock('../../../../lib/services/server/category-config-service');

describe('admin categories api', () => {
  it('should return categories', async () => {
    vi.mocked(CategoryConfigService.getAllCategories).mockResolvedValue([
      { _id: 'one', title: 'One', type: 'movie', order: 1, enabled: true }
    ] as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0]._id).toBe('one');
  });

  it('should save category', async () => {
    vi.mocked(CategoryConfigService.upsertCategory).mockResolvedValue();
    const req = new Request('http://test', { method: 'POST', body: JSON.stringify({ _id: 'two' }) });
    const res = await POST(req as any);
    expect(CategoryConfigService.upsertCategory).toHaveBeenCalledWith({ _id: 'two' });
    expect(res.status).toBe(200);
  });
});
