<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Follow extends Model
{
    use HasFactory;

    protected $fillable = [
        'follower',
        'following',
    ];

    public function getCreatedAtFormattedAttribute() {
        return $this->created_at->format('H:i d, M Y');
    }
}
