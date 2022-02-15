<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'content',
        'flag',
    ];

    public function user() {
        return $this->belongsTo(User::class);
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

    public function tags() {
        return $this->hasMany(Tag::class);
    }

    public function likes() {
        return $this->hasMany(Like::class);
    }
}
