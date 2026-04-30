import {
  CreatePost,
  DeletePost,
  ListPosts,
} from "@/services/secondary/devblog";
import { CreatePostInput } from "@/types/secondary/devblog-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useListPosts() {
  return useQuery({
    queryKey: ["list-posts"],
    queryFn: ListPosts,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => CreatePost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-posts"] });
      toast.success("Post publicado.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao publicar post.");
      console.error(error.message);
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DeletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-posts"] });
      toast.success("Post removido.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover post.");
      console.error(error.message);
    },
  });
}
