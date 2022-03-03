<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'image'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function getJWTIdentifier() {
        return $this->getKey();
    }

    public function getJWTCustomClaims() {
        return [];
    }

    public function getCreatedAtFormattedAttribute() {
        return $this->created_at->format('H:i d, M Y');
    }

    public function room() {
        return $this->hasOne(Room::class);
    }

    public function composers() {
        return $this->hasMany(Composer::class);
    }

    public function posts() {
        return $this->hasMany(Post::class);
    }

    public function comments() {
        return $this->hasMany(Comment::class);
    }

    public function audios() {
        return $this->hasMany(Audio::class);
    }

    public function images() {
        return $this->hasMany(Image::class);
    }

    public function chat_user() {
        return $this->hasOne(Chat_user::class);
    }

    public function messages() {
        return $this->hasMany(Message::class);
    }

    public function likes() {
        return $this->hasMany(Like::class);
    }
}
