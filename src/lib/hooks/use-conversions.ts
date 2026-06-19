"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/client";
import type { ConversionSummary } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

export function useConversions(initialData?: ConversionSummary[]) {
  return useQuery({
    queryKey: queryKeys.conversions.all,
    queryFn: async () =>
      (
        await fetchJson<{ conversions: ConversionSummary[] }>(
          "/api/tools/conversions"
        )
      ).conversions,
    initialData,
  });
}

export function useDeleteConversion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: true }>(`/api/tools/conversions/${id}`, {
        method: "DELETE",
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.conversions.all });
      const previous = queryClient.getQueryData<ConversionSummary[]>(
        queryKeys.conversions.all
      );
      queryClient.setQueryData<ConversionSummary[]>(
        queryKeys.conversions.all,
        (current = []) => current.filter((item) => item.id !== id)
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.conversions.all, context.previous);
      }
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.conversions.detail(id) });
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.conversions.all }),
  });
}
