<?php

namespace App\Http\Controllers;

use App\Models\Chat_user;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoomController extends Controller
{
    public function create(Request $req) {
        $validator = Validator::make($req->all(), [
            'title' => 'required|string|max:255',
            'creater' => 'required|integer',
            'content' => 'required|string|max:255',
            'max' => 'required|integer',
            'locked' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        // 방 만들기
        // locked 0이면 false로 공개방
        // 1이면 true로 비밀방
        $room = new Room();
        $room->fill($req->all());
        $password = $req->password;
        $room->password = $password;

        if (!$room->locked) {
            if (isset($password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => '비밀번호를 지워주세요'
                ], 412);
            }
        } else {
            if (!isset($password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => '비밀번호를 입력해주세요'
                ], 412);
            }
        }

        $room->save();

        // 방 만들면 chat_user테이블에 방장 추가
        // 방장 또한 room에 들어간 인원이기에
        $creater = new Chat_user();
        $creater->user_id = $req->creater;
        $creater->room_id = $room->id;
        $creater->flag = 0;
        $creater->save();

        $room->users = $creater->user;

        return response()->json([
            'status' => 'success',
            'room' => $room,
        ], 200);
    }

    public function show() {
        $rooms = Room::all();

        for ($i = 0; $i < $rooms->count(); $i++) {
            $room_id = $rooms[$i]->id;

            $users = Chat_user::where('room_id', $room_id)->get();

            for ($j = 0; $j <$users->count(); $j++) {
                $users[$j]->user;
            }

            $rooms[$i]->users = $users;
        }

        return response()->json([
            'status' => 'success',
            'rooms' => $rooms,
        ], 200);
    }

    public function update(Request $req, $room_id) {
        $validator = Validator::make($req->all(), [
            'title' => 'required|string|max:255',
            'creater' => 'required|integer',
            'content' => 'required|string|max:255',
            'max' => 'required|integer',
            'locked' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        $room = Room::find($room_id);
        $room_creater = $room->creater;

        if (!($room_creater == $req->creater)) {
            return response()->json([
                'status' => 'error',
                'message' => '작성자가 아닙니다.'
            ], 401);
        }

        $room->fill($req->all());
        $room->save();

        return response()->json([
            'status' => 'success',
            'room' => $room
        ]);
    }

    public function destory(Request $req, $room_id) {
        $validator = Validator::make($req->all(), [
            'creater' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        $room = Room::find($room_id);
        $room_creater = $room->creater;

        if (!($room_creater == $req->creater)) {
            return response()->json([
                'status' => 'error',
                'message' => '작성자가 아닙니다.'
            ], 401);
        }

        $room->delete();
        Chat_user::where('room_id', $room_id)->delete();

        return response()->json([
            'status' => 'success',
            'message' => '방을 삭제하였습니다.'
        ], 200);
    }

    public function enter(Request $req, $room_id) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }


        $room = Room::find($room_id);
        $users = Chat_user::where('room_id', $room_id)->get();


        if ($users->count() == $room->max) {
            return response()->json([
                'status' => 'error',
                'message' => '방 인원이 초과되었습니다.',
            ], 406);
        }

        if ($room->locked) {
            if ($room->password != $req->password) {
                return response()->json([
                    'status' => 'error',
                    'message' => '비밀번호를 다시 입력해주세요.',
                ], 400);
            }
        }

        // 새로고침 시 원래 있는 인원의 경우 요청 무시
        $userInRoom = Chat_user::where('user_id', $req->user_id)->where('room_id', $room_id)->get();

        if ($userInRoom->count() != 0) {
            return response()->json([
                'status' => 'error',
                'message' => '이미 들어와있습니다.'
            ], 400);
        }

        $user = new Chat_user();
        $user->user_id = $req->user_id;
        $user->room_id = $room_id;
        $user->flag = 0;
        $user->save();

        return response()->json([
            'status' => 'success',
            'user' => $user,
            'message' => '방을 입장하였습니다.'
        ], 200);
    }

    public function exit(Request $req, $room_id) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        Chat_user::where('user_id', $req->user_id)->where('room_id', $room_id)
                ->delete();

        return response()->json([
            'status' => 'success',
            'message' => '방을 퇴장하였습니다.',
        ], 200);
    }
}
