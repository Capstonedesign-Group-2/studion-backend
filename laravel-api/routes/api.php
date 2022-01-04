<?php

use App\Http\Controllers\JWTAuthController;
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

Route::prefix("users")->group(function () {
    Route::post("/register", [JWTAuthController::class, 'register']);
    Route::post("/login", [JWTAuthController::class, 'login']);
});

// 이런식으로 미들웨어 적용시 에러
// Route::prefix("users")->group(['middleware' => 'auth:api'], function () {
//     Route::get("/user", [JWTAuthController::class, 'user']);
//     Route::get("/logout", [JWTAuthController::class, 'logout']);
// });


// 이런식으로 미들웨어 적용해야 에러 안남
Route::group(['middleware' => 'auth:api'], function () {
    Route::prefix("users")->group(function () {
        Route::get("/user", [JWTAuthController::class, 'user']);
        Route::get("/logout", [JWTAuthController::class, 'logout']);
    });
});

// // 로그인 상관없는 api
Route::prefix("rooms")->group(function () {

});

// // 로그인한 유저만 가능한 api
// Route::prefix("rooms")->group(['middleware' => 'auth:api'], function () {

// });

Route::prefix("posts")->group(function () {

});

// Route::prefix("posts")->group(['middleware' => 'auth:api'], function () {

// });

Route::get('unauthorized', function() {
    return response()->json([
        'status' => 'error',
        'message' => 'Unauthorized'
    ], 401);
})->name('api.jwt.unauthorized');
