<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        $user = User::find(User::all()->pluck('id')->random());

        return [
            'user_id' => $user->id,
            'title' => $user->name,
            'content' => $this->faker->realText(20),
            'flag' => 0
        ];
    }
}
