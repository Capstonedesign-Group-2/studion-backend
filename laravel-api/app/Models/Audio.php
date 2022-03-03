<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Audio extends Model
{
    use HasFactory;

    protected $table = 'audios';

    protected $fillable = [
        'user_id',
        'post_id',
        'link',
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function post() {
        return $this->belongsTo(Post::class);
    }

    public function composers() {
        return $this->hasMany(Composer::class);
    }

    public function getCreatedAtFormattedAttribute() {
        return $this->created_at->format('H:i d, M Y');
    }
}
