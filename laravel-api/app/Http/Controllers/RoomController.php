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
            ], 200);
        }

        // 방 만들기
        $room = new Room();
        $room->fill($req->all());
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

            $users =

        }

        return response()->json([
            'status' => 'success',
            'rooms' => $rooms,
        ]);
    }
}
