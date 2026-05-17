<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $username = trim((string) $request->input('username', ''));
        $password = (string) $request->input('password', '');

        $user = User::query()
            ->where('email', $username)
            ->orWhere('name', $username)
            ->first();

        if ($user && Hash::check($password, $user->password)) {
            $token = Str::random(64);
            $user->forceFill(['api_token' => $token])->save();

            return response()->json([
                'authenticated' => true,
                'token' => $token,
                'user' => $this->userPayload($user),
            ]);
        }

        return response()->json(['authenticated' => false], 401);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'authenticated' => true,
            'user' => $this->userPayload($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->forceFill(['api_token' => null])->save();

        return response()->json(null, 204);
    }

    private function userPayload(?User $user): array
    {
        return [
            'id' => $user?->id,
            'name' => $user?->name,
            'email' => $user?->email,
        ];
    }
}
