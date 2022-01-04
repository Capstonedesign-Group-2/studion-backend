<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    use HasFactory;

    protected $fillable = [
        'location',
        'content',
        'room_id',
        'post_id',
    ];

    public function room() {
        return $this->belongsTo(Room::class);
    }

    public function post() {
        return $this->belongsTo(Post::class);
    }
}
