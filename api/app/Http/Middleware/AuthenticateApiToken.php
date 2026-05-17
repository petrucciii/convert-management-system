<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        if (! is_string($token) || trim($token) === '') {
            return response()->json(['message' => 'Non autenticato.'], 401);
        }

        $user = User::query()->where('api_token', $token)->first();

        if (! $user) {
            return response()->json(['message' => 'Token non valido.'], 401);
        }

        Auth::setUser($user);
        $request->setUserResolver(fn (): User => $user);

        return $next($request);
    }
}
