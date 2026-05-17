<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Town;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TownController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Town::query()
                ->with('region')
                ->orderBy('province')
                ->orderBy('name')
                ->get()
                ->map(fn (Town $town): array => $this->toArray($town))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $town = Town::query()->create($this->data($request));

        return response()->json($this->toArray($town->load('region')), 201);
    }

    public function show(Town $town): JsonResponse
    {
        return response()->json($this->toArray($town->load('region')));
    }

    public function update(Request $request, Town $town): JsonResponse
    {
        $town->update($this->data($request));

        return response()->json($this->toArray($town->fresh('region')));
    }

    public function destroy(Town $town): JsonResponse
    {
        $town->delete();

        return response()->json(null, 204);
    }

    private function data(Request $request): array
    {
        return [
            'region_id' => $this->nullableInt($request->input('region_id')),
            'name' => $this->titleString($request->input('name', $request->input('nome'))),
            'province' => $this->upperString($request->input('province', $request->input('provincia'))),
            'postal_code' => $this->upperString($request->input('postal_code', $request->input('cap'))),
            'description' => $this->nullableString($request->input('description', $request->input('descrizione'))),
        ];
    }

    private function toArray(Town $town): array
    {
        return [
            'id' => (string) $town->id,
            'region_id' => $town->region_id ? (string) $town->region_id : null,
            'name' => $town->name,
            'province' => $town->province,
            'postal_code' => $town->postal_code,
            'description' => $town->description,
            'region' => $town->region ? [
                'id' => (string) $town->region->id,
                'name' => $town->region->name,
                'description' => $town->region->description,
            ] : null,
        ];
    }

    private function nullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function titleString(mixed $value): ?string
    {
        $value = $this->nullableString($value);

        return $value === null ? null : Str::of($value)->lower()->title()->toString();
    }

    private function upperString(mixed $value): ?string
    {
        $value = $this->nullableString($value);

        return $value === null ? null : Str::upper($value);
    }
}
