<?php

namespace App\Http\Controllers;

use App\Models\Chat_room;
use App\Models\Chat_user;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChatRoomController extends Controller
{
    // 채팅룸 생성
    public function create(Request $req) {
        $validator = Validator::make($req->all(), [
            'title' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        $chat = new Chat_room();
        $chat->fill($req->all);

        for (;;) {

        }
    }

    // 채팅룸 리스트 보여주기
    public function show(Request $req) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        Chat_user::where('user_id', $req->user_id)->where('flag', 1)->get();
    }

    // 채팅룸 수정
    public function update() {

    }

    // 채팅룸 폭파
    public function destory() {

    }

    // 채팅룸 입장
    public function enter() {

    }

    // 채팅룸 나가기
    public function exit() {

    }
}
