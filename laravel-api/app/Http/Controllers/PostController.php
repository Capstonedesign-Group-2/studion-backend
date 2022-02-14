<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function uploadFile($req) {
        // 이름에 시간 넣기
        $name = $req->file('image')->getClientOriginalName();
        $extension = $req->file('image')->extension();
        $nameWithoutExtension = Str::of($name)->basename('.' . $extension);
        $fileName = $nameWithoutExtension . '_' . time() . '.' . $extension;

        $req->file('image')->storeAs('image', $fileName, 's3');

        return Storage::disk('s3')->url('image/' . $fileName);
    }

    public function deleteFile($fileUrl) {
        $fileName = substr($fileUrl, strpos($fileUrl, 'image'));
        Storage::disk('s3')->delete($fileName);
    }

    public function create(Request $req) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer',
            'content' => 'required|string',
            'image' => 'image|mimes:jpg,png,jpeg,gif,svg|max:2048'
        ]);

        if($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        $post = new Post();
        $post->fill($req->all());
        $post->title = User::find($req->user_id)->name;
        $post->flag = 0;

        if (isset($req->image)) {
            $post->image = $this->uploadFile($req);
        }

        $post->save();

        return response()->json([
            'status' => 'success',
            'post' => $post
        ], 200);
    }

    public function show() {
        // 전체리스트 시 작성자 정보까지만
        // 댓글같은 경우 자세히보기 시 제공
        // 좋아요 수와 댓글 수 제공
        $posts = Post::all();

        for ($i = 0; $i < $posts->count(); $i++) {
            $posts[$i]->user;
        }

        return response()->json([
            'status' => 'success',
            'posts' => $posts,
        ], 200);
    }

    public function update(Request $req, $post_id) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer',
            'content' => 'required|string',
            'image' => 'image|mimes:jpg,png,jpeg,gif,svg|max:2048'
        ]);

        if($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        $post = Post::find($post_id);

        if ($post->user_id != $req->user_id) {
            return response()->json([
                'status' => 'error',
                'message' => '작성자가 아닙니다.'
            ], 401);
        }


        if (isset($req->image)) {
            $this->deleteFile($post->image);
            $post->fill($req->all());
            $post->image = $this->uploadFile($req);
        }

        $post->save();

        return response()->json([
            'status' => 'success',
            'post' => $post
        ], 200);
    }

    public function destory(Request $req, $post_id) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer',
        ]);

        if($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        $post = Post::find($post_id);

        if ($post->user_id != $req->user_id) {
            return response()->json([
                'status' => 'error',
                'message' => '작성자가 아닙니다.'
            ], 401);
        }

        // 파일 삭제하고 게시판 삭제
        if (isset($post->image)) {
            $this->deleteFile($post->image);
        }

        $post->delete();

        return response()->json([
            'status' => 'success',
            'message' => '삭제하였습니다.'
        ], 200);
    }
}
