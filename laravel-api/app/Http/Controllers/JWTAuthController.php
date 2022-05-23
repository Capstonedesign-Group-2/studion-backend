<?php

namespace App\Http\Controllers;

use App\Models\Chat_user;
use App\Models\Follow;
use App\Models\Image;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class JWTAuthController extends Controller
{
    public function user() {
        $user = auth('api')->user();
        $user->followers = Follow::where('following', $user->id)->count();
        $user->followings = Follow::where('follower', $user->id)->count();

        return response()->json($user, 200);
    }

    public function info($user_id) {
        $user = User::findOrFail($user_id);
        $user->followers = Follow::where('following', $user_id)->count();
        $user->followings = Follow::where('follower', $user_id)->count();

        return response()->json([
            'status' => 'success',
            'user' => $user
        ]);
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
                'message' => $validator->errors()->toJson()
            ], 422);
        }

        $user = new User();
        $user->fill($req->all());
        $user->password = bcrypt($req->password);
        $user->save();

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
            ], 422);
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
            'expires_in' => auth('api')->factory()->getTTL() * 1,
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
            ], 422);
        }

        // 내가 포함된 함주실 정보와 합주실 인원들까지
        // chat_user, room, user 테이블 이용
        // chat_user에 user_id로 합주실 알아내고
        // 합주실의 관계정의로 데이터를 가져온다.
        $room_id = Chat_user::where('user_id', $req->user_id)->where('flag', 0)->first();
    }

    public function edit(Request $req, $user_id) {
        $validator = Validator::make($req->all(), [
            'name' => 'string|max:100',
            'email' => 'email|max:255|unique:users',
            'password' => 'string|min:8|max:255|confirmed',
            'password_confirmation' => 'string|min:8|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->toJson(),
            ], 422);
        }

        $user = User::findOrFail($user_id);

        if (isset($req->name)) $user->name = $req->name;
        if (isset($req->email)) $user->email = $req->email;
        if (isset($req->password)) $user->password = bcrypt($req->password);
        $this->uploadFile($req, $user);

        $user->save();

        return response()->json([
            'status' => 'success',
            'user' => $user
        ], 200);
    }

    public function uploadFile($req, $user) {
        // 이름에 시간 넣기
        $name = $req->file('image')->getClientOriginalName();
        $extension = $req->file('image')->extension();
        $nameWithoutExtension = Str::of($name)->basename('.' . $extension);
        $fileName = $nameWithoutExtension . '_' . time() . '.' . $extension;

        $req->file('image')->storeAs('image', $fileName, 's3');

        $user->image = Storage::disk('s3')->url('image/' . $fileName);
    }

    public function delete($user_id) {
        $user = User::findOrFail($user_id);

        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'deleted user info'
        ], 200);
    }

    public function check(Request $req, $user_id) {

    }
}
