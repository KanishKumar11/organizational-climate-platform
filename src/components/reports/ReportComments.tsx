'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Send,
  Reply,
  MoreVertical,
  User,
  Clock,
} from 'lucide-react';

interface Comment {
  id: string;
  userId: string;
  content: string;
  section?: string;
  position?: {
    x: number;
    y: number;
  };
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  replies?: Comment[];
}

interface ReportCommentsProps {
  reportId: string;
  permissions: 'view' | 'comment' | 'edit';
  className?: string;
}

export function ReportComments({
  reportId,
  permissions,
  className,
}: ReportCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [reportId]);

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addComment = async (content: string, parentId?: string) => {
    if (!content.trim() || permissions === 'view') return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          parentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (parentId) {
          // Add reply to existing comment
          setComments((prev) =>
            prev.map((comment) =>
              comment.id === parentId
                ? {
                    ...comment,
                    replies: [...(comment.replies || []), data.comment],
                  }
                : comment
            )
          );
          setReplyContent('');
          setReplyTo(null);
        } else {
          // Add new top-level comment
          setComments((prev) => [data.comment, ...prev]);
          setNewComment('');
        }
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const CommentItem = ({
    comment,
    isReply = false,
  }: {
    comment: Comment;
    isReply?: boolean;
  }) => (
    <div className={`${isReply ? 'ml-8 mt-3' : ''}`}>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm">{comment.user.name}</span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {formatDate(comment.createdAt)}
              </div>
              {comment.section && (
                <Badge variant="secondary" className="text-xs">
                  {comment.section}
                </Badge>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-3">{comment.content}</p>

            {permissions !== 'view' && !isReply && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(comment.id)}
                  className="gap-1 text-xs"
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </Button>
              </div>
            )}
          </div>

          <Button variant="ghost" size="sm" className="p-1">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Reply form */}
        {replyTo === comment.id && (
          <div className="mt-4 ml-11">
            <div className="flex gap-2">
              <textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="flex-1 p-2 border rounded-lg resize-none text-sm"
                rows={2}
              />
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  onClick={() => addComment(replyContent, comment.id)}
                  disabled={!replyContent.trim() || isSubmitting}
                  className="gap-1"
                >
                  <Send className="h-3 w-3" />
                  Reply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-gray-600" />
        <h3 className="font-medium">Comments ({comments.length})</h3>
      </div>

      {/* Add new comment */}
      {permissions !== 'view' && (
        <Card className="p-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-3 border rounded-lg resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={() => addComment(newComment)}
                  disabled={!newComment.trim() || isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No comments yet</p>
            {permissions !== 'view' && (
              <p className="text-sm">Be the first to add a comment!</p>
            )}
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}
