import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // ข้อมูลถือว่าสดใหม่ 1 นาที (ไม่ fetch ซ้ำ)
        retry: 1, // ถ้า error ให้ลองใหม่แค่ 1 ครั้งพอ
        refetchOnWindowFocus: false, // ปิดการ fetch ใหม่ทุกครั้งที่สลับหน้าจอ (ลดภาระ Server)
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
