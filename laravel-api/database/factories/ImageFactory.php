<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ImageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'user_id' => User::all()->pluck('id')->random(),
            'post_id' => Post::all()->pluck('id')->random(),
            'link' => $this->faker->imageUrl(640, 480, 'animals', true)
        ];
    }
}
