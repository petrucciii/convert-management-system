<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
            return response()->json([
                'authenticated' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ]);
        }

        // Bootstrap locale: permette di entrare prima di creare utenti reali.
        if (User::query()->doesntExist() && $username === 'admin' && $password === 'admin') {
            return response()->json([
                'authenticated' => true,
                'user' => [
                    'id' => null,
                    'name' => 'Admin locale',
                    'email' => null,
                ],
            ]);
        }

        return response()->json(['authenticated' => false], 401);
    }
}
