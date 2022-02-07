<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PostController extends Controller
{
    public function create(Request $req) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer',
            'content' => 'required|string'
        ]);

        if($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'messages' => $validator->errors()->toJson()
            ], 200);
        }

        $post = new Post();
        $post->fill($req->all());
        $post->flag = 0;

        $post->save();

        return response()->json([
            'status' => 'success',
            'post' => $post
        ], 200);
    }

    public function show() {

    }

    public function detail($post_id) {

    }

    public function update(Request $req, $post_id) {

    }

    public function destory(Request $req, $post_id) {

    }
}
