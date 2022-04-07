<?php

namespace App\Http\Controllers;

use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LikeController extends Controller
{
    // 좋아요
    public function like(Request $req, $post_id) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        $like = new Like();
        $like->fill($req->all());
        $like->post_id = $post_id;
        $like->save();

        return response()->json([
            'status' => 'success',
            'like' => $like
        ], 200);
    }

    // 좋아요 해제
    public function unLike(Request $req, $post_id) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        $like = Like::where('user_id', $req->user_id)->where('post_id', $post_id)->first();
        $like->delete();

        return response()->json([
            'status' => 'success',
            'message' => '취소했습니다.',
        ], 200);
    }

    // 특정 게시물에 좋아요 한 사람들
    public function show($post_id) {
        $likes = Like::where('post_id', $post_id)->orderBy('created_at', 'desc')->paginate(15);

        for ($i = 0; $i < $likes->count(); $i++) {
            $likes[$i]->user;
            $likes[$i]->created = $likes[$i]->created_at_formatted;
        }

        return response()->json([
            'status' => 'success',
            'likes' => $likes
        ], 200);
    }

    // 본인이 좋아요 한 게시물들
    public function likeToPosts($user_id) {
        $likes = Like::where('user_id', $user_id)->orderBy('created_at', 'desc')->paginate(15);

        for ($i = 0; $i < $likes->count(); $i++) {
            $likes[$i]->post->user;
        }

        return response()->json([
            'status' => 'success',
            'likeToPosts' => $likes
        ], 200);
    }
}
