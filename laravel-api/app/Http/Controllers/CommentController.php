<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CommentController extends Controller
{
    public function create(Request $req) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer',
            'post_id' => 'required|integer',
            'content' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        $comment = new Comment();
        $comment->fill($req->all());
        $comment->save();

        return response()->json([
            'status' => 'success',
            'comment' => $comment
        ], 200);
    }

    public function show($post_id) {
        $comments = Comment::where('post_id', $post_id)->orderBy('created_at', 'desc')->paginate(15);

        for ($i = 0; $i < $comments->count(); $i++) {
            $comments[$i]->user;
            $comments[$i]->created = $comments[$i]->created_at_formatted;
        }

        return response()->json([
            'status' => 'success',
            'comments' => $comments
        ], 200);
    }

    public function update(Request $req, $comment_id) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer',
            'content' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        $comment = Comment::find($comment_id);

        if ($comment->user_id != $req->user_id) {
            return response()->json([
                'status' => 'error',
                'message' => '작성자가 아닙니다.'
            ], 401);
        }

        $comment->fill($req->all());
        $comment->save();

        return response()->json([
            'status' => 'success',
            'comment' => $comment
        ], 200);
    }

    public function destory(Request $req, $comment_id) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        $comment = Comment::find($comment_id);

        if ($comment->user_id != $req->user_id) {
            return response()->json([
                'status' => 'error',
                'message' => '작성자가 아닙니다.'
            ], 401);
        }

        $comment->delete();

        return response()->json([
            'status' => 'success',
            'message' => '삭제되었습니다.'
        ], 200);
    }


}
