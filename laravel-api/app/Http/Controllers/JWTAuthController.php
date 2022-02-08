<?php

namespace App\Http\Controllers;

use App\Models\Chat_user;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JWTAuthController extends Controller
{
    public function user() {
        return response()->json(auth('api')->user());
    }

    public function register(Request $req) {
        $validator = Validator::make($req->all(), [
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:255|unique:users',
            'password' => 'required|string|min:8|max:255|confirmed',
            'password_confirmation' => 'required|string|min:8|max:255',
        ]);

        if($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'messages' => $validator->errors()->toJson()
            ], 200);
        }

        $user = new User();
        $user->fill($req->all());
        $user->password = bcrypt($req->password);
        $user->save();

        // return response()->json([
        //     'status' => 'success',
        //     'data' => $user
        // ], 200);

        if (!$token = auth('api')->attempt(['email' => $req->email, 'password' => $req->password])) {
            return response()->json(['error' => 'Unuthorized'], 401);
        }

        return $this->respondWithToken($token, $req->email);
    }

    public function login(Request $req) {
        $validator = Validator::make($req->all(), [
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:8|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->toJson(),
            ], 200);
        }

        $credentials = $req->all();
        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json(['error' => 'Unuthorized'], 401);
        }

        return $this->respondWithToken($token, $req->email);
    }

    protected function respondWithToken($token, $email) {
        $user_id = User::where('email', $email)->first()->id;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'loginSuccess' => true,
            'userId' => $user_id,
        ], 200);
    }

    public function refresh() {
        return $this->respondWithToken(auth('api')->refresh());
    }

    public function logout() {
        auth('api')->logout();

        return response()->json([
            'status' => 'success',
            'message' => 'logout'
        ], 200);
    }

    public function myRoom(Request $req) {
        $validator = Validator::make($req->all(), [
            'user_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->toJson(),
            ], 200);
        }

        // 내가 포함된 함주실 정보와 합주실 인원들까지
        // chat_user, room, user 테이블 이용
        // chat_user에 user_id로 합주실 알아내고
        // 합주실의 관계정의로 데이터를 가져온다.
        $room_id = Chat_user::where('user_id', $req->user_id)->where('flag', 0)->first();

    }
}
