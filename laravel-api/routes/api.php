<?php

use App\Http\Controllers\JWTAuthController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\RoomController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware(['cors'])->group(function() {
    Route::get('/csrf_token', function() {
        return csrf_token();
    });

    // 이런식으로 미들웨어 적용해야 에러 안남
    Route::prefix("users")->group(function () {
        // token이 필요없는 route
        Route::post("/register", [JWTAuthController::class, 'register']);
        Route::post("/login", [JWTAuthController::class, 'login']);

        // token이 필요한 route
        Route::group(['middleware' => 'auth:api'], function () {
            Route::get("/user", [JWTAuthController::class, 'user']);
            Route::get("/logout", [JWTAuthController::class, 'logout']);
        });
    });

    // 이런식으로 미들웨어 적용시 에러
    // Route::prefix("users")->group(['middleware' => 'auth:api'], function () {
    //     Route::get("/user", [JWTAuthController::class, 'user']);
    //     Route::get("/logout", [JWTAuthController::class, 'logout']);
    // });

    Route::prefix("rooms")->group(function () {
        // token이 필요없는 route
        Route::get("/show", [RoomController::class, 'show']);

        // token이 필요한 route
        Route::group(['middleware' => 'auth:api'], function () {
            Route::post("/create", [RoomController::class, 'create']);
            Route::post("/enter/{room_id}", [RoomController::class, 'enter']);
            Route::patch("/update/{room_id}", [RoomController::class, 'update']);
            Route::delete("/destory/{room_id}", [RoomController::class, 'destory']);
            Route::delete("/exit/{room_id}", [RoomController::class, 'exit']);
        });
    });

    Route::prefix("chats")->group(function () {
        // token이 필요없는 route

        // token이 필요한 route
        Route::group(['middleware' => 'auth:api'], function () {

        });
    });

    Route::prefix("posts")->group(function () {
        // token이 필요없는 route
        Route::get("/show", [PostController::class, 'show']);
        Route::get("/detail/{post_id}", [PostController::class, 'detail']);

        // token이 필요한 route
        Route::group(['middleware' => 'auth:api'], function () {
            Route::post("/create", [PostController::class, 'create']);
            Route::patch("/update/{post_id}", [PostController::class, 'update']);
            Route::delete("/destory/{post_id}", [PostController::class, 'destory']);
        });
    });

    Route::prefix("likes")->group(function () {
        // token이 필요없는 route
        Route::get('/get/{post_id}', [LikeController::class, 'getLikes']);

        // token이 필요한 route
        Route::group(['middleware' => 'auth:api'], function () {
            Route::post('/like/{post_id}', [LikeController::class, 'like']);
            Route::delete('/unlike/{post_id}', [LikeController::class, 'unLike']);
        });
    });

    Route::get('unauthorized', function() {
        return response()->json([
            'status' => 'error',
            'message' => 'Unauthorized'
        ], 401);
    })->name('api.jwt.unauthorized');
});


