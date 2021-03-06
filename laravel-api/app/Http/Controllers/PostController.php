<?php

namespace App\Http\Controllers;

use App\Models\Audio;
use App\Models\Composer;
use App\Models\Image;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function uploadFile($req, $file) {
        // 이름에 시간 넣기
        $name = $req->file($file)->getClientOriginalName();
        $extension = $req->file($file)->extension();
        $nameWithoutExtension = Str::of($name)->basename('.' . $extension);
        $fileName = $nameWithoutExtension . '_' . time() . '.' . $extension;

        $req->file($file)->storeAs($file, $fileName, 's3');

        if ($file == 'image') $saveFile = new Image();
        else if ($file == 'audio') $saveFile = new Audio();

        $saveFile->user_id = $req->user_id;
        $saveFile->post_id = $req->post_id;
        $saveFile->link = Storage::disk('s3')->url($file . '/' . $fileName);
        $saveFile->save();

        if (isset($req->composers) && $file == 'audio') {
            $this->createComposer($req, $saveFile->id);
        }
    }

    public function deleteFile($fileUrls, $file) {
        for ($i = 0; $i < $fileUrls->count(); $i++) {
            $fileName = substr($fileUrls[$i]->link, strpos($fileUrls[$i]->link, $file));
            Storage::disk('s3')->delete($fileName);
            $fileUrls[$i]->delete();
        }
    }

    public function createComposer($req, $audio_id) {
        for ($i = 0; $i < count($req->composers); $i++) {
            $composer = new Composer();
            $composer->user_id = $req->composers[$i];
            $composer->audio_id = $audio_id;
            $composer->save();
        }
    }

    public function create(Request $req) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer',
            'content' => 'required|string',
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
        $post->save();

        $req->post_id = $post->id;

        if (isset($req->image)) {
            $file = 'image';
            $this->uploadFile($req, $file);
            $post->images;
        }

        if (isset($req->audio)) {
            $file = 'audio';
            $this->uploadFile($req, $file);
            $post->audios;
            for ($i = 0; $i < $post->audios->count(); $i++) {
                $post->audios[$i]->composers;
            }
        }


        return response()->json([
            'status' => 'success',
            'post' => $post
        ], 200);
    }

    public function show() {
        // 전체리스트 시 작성자 정보까지만
        // 댓글같은 경우 자세히보기 시 제공
        // 좋아요 수와 댓글 수 제공
        $posts = Post::orderBy('created_at', 'desc')->paginate(9);

        for ($i = 0; $i < $posts->count(); $i++) {
            $posts[$i]->user;
            $posts[$i]->images;
            $posts[$i]->audios = $posts[$i]->audios()->get();
            $posts[$i]->likes = $posts[$i]->likes()->get()->count();

            for ($j = 0; $j < $posts[$i]->audios->count(); $j++) {
                $posts[$i]->audios[$j]->composers = $posts[$i]->audios[$j]->composers()->get();

                for ($z = 0; $z < $posts[$i]->audios[$j]->composers->count(); $z++) {
                    $posts[$i]->audios[$j]->composers[$z]->user;
                }
            }

            $posts[$i]->created = $posts[$i]->created_at_formatted;
        }

        return response()->json([
            'status' => 'success',
            'posts' => $posts,
        ], 200);
    }

    public function detail($post_id) {
        $post = Post::find($post_id);
        $post->user;
        $post->images;
        $post->audios = $post->audios()->get();
        $post->likes = $post->likes()->get()->count();

        for ($j = 0; $j < $post->audios->count(); $j++) {
            $post->audios[$j]->composers = $post->audios[$j]->composers()->get();

            for ($z = 0; $z < $post->audios[$j]->composers->count(); $z++) {
                $post->audios[$j]->composers[$z]->user;
            }
        }

        $post->created = $post->created_at_formatted;

        return response()->json([
            'status' => 'success',
            'post' => $post,
        ], 200);
    }

    public function user_post($user_id) {
        // 개인에 대한 게시글
        $posts = Post::where('user_id', $user_id)->orderBy('created_at', 'desc')->paginate(15);

        for ($i = 0; $i < $posts->count(); $i++) {
            $posts[$i]->user;
            $posts[$i]->images;
            $posts[$i]->audios = $posts[$i]->audios()->get();
            $posts[$i]->likes = $posts[$i]->likes()->get()->count();

            for ($j = 0; $j < $posts[$i]->audios->count(); $j++) {
                $posts[$i]->audios[$j]->composers = $posts[$i]->audios[$j]->composers()->get();

                for ($z = 0; $z < $posts[$i]->audios[$j]->composers->count(); $z++) {
                    $posts[$i]->audios[$j]->composers[$z]->user;
                }
            }

            $posts[$i]->created = $posts[$i]->created_at_formatted;
        }

        return response()->json([
            'status' => 'success',
            'posts' => $posts
        ], 200);
    }

    public function update(Request $req, $post_id) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer',
            'content' => 'required|string',
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

        $post->fill($req->all());
        $post->save();

        // 삭제 할 땐 각각의 model객체 넘겨줄 것
        if (isset($req->image)) {
            $file = 'image';
            $images = Image::where('post_id', $post->id)->get();
            $this->deleteFile($images, $file);

            $this->uploadFile($req, $file);
            $post->images;
        }

        if (isset($req->audio)) {
            $file = 'audio';
            $audios = Audio::where('post_id', $post->id)->get();
            $this->deleteFile($audios, $file);

            $this->uploadFile($req, $file);
            $post->audios;
        }

        return response()->json([
            'status' => 'success',
            'post' => $post
        ], 200);
    }

    public function rank($date) {
        $to = date("Y-m-d H:i:s");
        if ($date == 'week') {
            $from = date("Y-m-d H:i:s", strtotime("-1 week"));
        } else if ($date == 'month') {
            $from = date("Y-m-d H:i:s", strtotime("-1 month"));
        }

        $posts = Post::whereBetween('created_at', [$from, $to])->withCount('likes')
            ->orderBy('likes_count', 'desc')
            ->orderBy('created_at', 'desc')->limit(3)->get();

        foreach($posts as $post) {
            $post->user;
            $post->images;
            $post->audios = $post->audios()->get();
            $post->likes = $post->likes()->get()->count();

            foreach($post->audios as $audio) {
                $audio->composers = $audio->composers()->get();

                foreach($audio->composers as $composer) {
                    $composer->user;
                }
            }

            $post->created = $post->created_at_formatted;
        }

        return response()->json([
            'status' => 'success',
            'posts' => $posts
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
        if ($post->images->count() != 0) {
            $file = 'image';
            $images = Image::where('post_id', $post->id)->get();
            $this->deleteFile($images, $file);
        }

        if ($post->audios->count() != 0) {
            $file = 'audio';
            $audios = Audio::where('post_id', $post->id)->get();
            $this->deleteFile($audios, $file);
        }

        $post->delete();

        return response()->json([
            'status' => 'success',
            'message' => '삭제하였습니다.'
        ], 200);
    }
}
