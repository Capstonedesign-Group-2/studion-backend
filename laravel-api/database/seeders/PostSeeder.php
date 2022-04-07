<?php

namespace Database\Seeders;

use App\Models\Audio;
use App\Models\Comment;
use App\Models\Image;
use App\Models\Like;
use App\Models\Post;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        Post::factory()
            ->has(Image::factory()->count(1))
            ->has(Audio::factory()->count(1), 'audios')
            ->has(Comment::factory()->count(28))
            ->has(Like::factory()->count(28))
            ->count(100)
            ->create();
    }
}
