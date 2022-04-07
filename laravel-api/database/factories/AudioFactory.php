<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AudioFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    protected $table = 'audios';

    public function definition()
    {
        return [
            'user_id' => User::all()->pluck('id')->random(),
            'post_id' => Post::all()->pluck('id')->random(),
            'link' => 'https://studion-s3.s3.ap-northeast-2.amazonaws.com/audio/GAYLE-abcdefu_1648636219.mp3'
        ];
    }
}
