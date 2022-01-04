<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'creater',
        'content',
        'max',
        'locked',
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function tags() {
        return $this->hasMany(Tag::class);
    }
}
