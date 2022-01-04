<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chat_user extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'room_id',
        'chat_room_id',
        'flag',
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }
}
