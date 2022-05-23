<?php

use App\Http\Controllers\CommentController;
use App\Http\Controllers\FollowController;
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

    Route::prefix("users")->group(function () {
        // token이 필요한 route
        Route::group(['middleware' => 'auth:api'], function () {
            Route::get("/user", [JWTAuthController::class, 'user']);
            Route::get("/logout", [JWTAuthController::class, 'logout']);
            Route::patch("/{user_id}", [JWTAuthController::class, 'edit']);
        });

        // token이 필요없는 route
        Route::post("/register", [JWTAuthController::class, 'register']);
        Route::post("/login", [JWTAuthController::class, 'login']);
        Route::get("/{user_id}", [JWTAuthController::class, 'info']);
    });

    Route::prefix("rooms")->group(function () {
        Route::get("/", [RoomController::class, 'show']);

        Route::group(['middleware' => 'auth:api'], function () {
            Route::post("/", [RoomController::class, 'create']);
            Route::post("/{room_id}", [RoomController::class, 'enter']);
            Route::patch("/{room_id}", [RoomController::class, 'update']);
            Route::delete("/{room_id}", [RoomController::class, 'destory']);
            Route::delete("/exit/{room_id}", [RoomController::class, 'exit']);
        });
    });

    Route::prefix("posts")->group(function () {
        Route::get("/rank/{date}", [PostController::class, 'rank']);
        Route::get("/", [PostController::class, 'show']);
        Route::get("/{user_id}", [PostController::class, 'user_post']);
        Route::get("/show/{post_id}", [PostController::class, 'detail']);

        Route::group(['middleware' => 'auth:api'], function () {
            Route::post("/", [PostController::class, 'create']);
            Route::patch("/{post_id}", [PostController::class, 'update']);
            Route::delete("/{post_id}", [PostController::class, 'destory']);
        });
    });

    Route::prefix("likes")->group(function () {
        Route::get('/{post_id}', [LikeController::class, 'show']);

        Route::group(['middleware' => 'auth:api'], function () {
            Route::get('/posts/{user_id}', [LikeController::class, 'likeToPosts']);
            Route::post('/exist/{post_id}', [LikeController::class, 'exist']);
            Route::post('/{post_id}', [LikeController::class, 'like']);
            Route::delete('/{post_id}', [LikeController::class, 'unLike']);
        });
    });

    Route::prefix("comments")->group(function () {
        Route::get('/{post_id}', [CommentController::class, 'show']);

        Route::group(['middleware' => 'auth:api'], function () {
            Route::post('/', [CommentController::class, 'create']);
            Route::patch('/{comment_id}', [CommentController::class, 'update']);
            Route::delete('/{comment_id}', [CommentController::class, 'destory']);
        });
    });

    Route::prefix("follows")->group(function () {
        Route::get('/{id}/{kind}', [FollowController::class, 'show']);

        Route::group(['middleware' => 'auth:api'], function () {
            Route::post('/', [FollowController::class, 'follow']);
            Route::post('/{id}', [FollowController::class, 'exist']);
            Route::delete('/{id}', [FollowController::class, 'unfollow']);
        });
    });

    Route::get('unauthorized', function() {
        return response()->json([
            'status' => 'error',
            'message' => 'Unauthorized'
        ], 401);
    })->name('api.jwt.unauthorized');
});


