<?php

namespace App\Http\Controllers;

use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FollowController extends Controller
{
    // following 하기
    public function follow(Request $req) {
        $validator = Validator::make($req->all(), [
            'following' => 'required|integer',
            'follower' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        // follower -> 본인, following -> 상대
        $follow = new Follow();
        $follow->fill($req->all());

        $follow->save();

        return response()->json([
            'status' => 'success',
        ], 200);
    }

    // following or follower 취소하기
    public function unfollow($id) {
        $follow = Follow::findOrFail($id);

        if ($follow->delete()) {
            return response()->json([
                'status' => 'success'
            ], 200);
        }
    }

    // following or follower 보기
    public function show($id, $kind) {
        if ($kind == 'follower') {
            $follows = Follow::where('following', $id)->get();
        } else if ($kind == 'following') {
            $follows = Follow::where('follower', $id)->get();
        }

        foreach($follows as $follow) {
            $follow->follower = User::find($follow->follower);
            $follow->following = User::find($follow->following);
        }

        return response()->json([
            'status' => 'success',
            'follows' => $follows,
            'kind' => $kind
        ], 200);
    }

    // 내 follow인지
    public function exist(Request $req, $id) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        $exist = Follow::where('follower', $req->user_id)->where('following', $id)->get();

        if ($exist->count()) {
            return response()->json([
                'status' => true,
                'follow_id' => $exist[0]->id
            ], 200);
        } else {
            return response()->json([
                'status' => false
            ], 200);
        }
    }
}
