<?php

namespace App\Http\Controllers\Notification;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    private function u($r)
    {
        return $r->attributes->get('legacy_auth_user')->id;
    }

    public function index(Request $r)
    {
        try {
            $x = DB::table('notification')->where('user_id', $this->u($r))->orderByDesc('created_at')->limit(min((int) $r->query('limit', 20) ?: 20, 50))->get()->map(fn ($n) => ['id' => $n->id, 'type' => $n->notification_type, 'title' => $n->title, 'body' => $n->message, 'link' => null, 'is_read' => $n->is_read, 'created_at' => $n->created_at]);

            return response()->json(['data' => $x, 'unread_count' => $x->where('is_read', 0)->count()]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Lỗi lấy thông báo', 'error' => $e->getMessage()], 500);
        }
    }

    public function read(Request $r, $id)
    {
        $n = DB::table('notification')->where('id', $id)->where('user_id', $this->u($r))->update(['is_read' => 1, 'read_at' => now()]);

        return $n ? response()->json(['message' => 'Đã đánh dấu đã đọc.']) : response()->json(['message' => 'Không tìm thấy thông báo.'], 404);
    }

    public function readAll(Request $r)
    {
        DB::table('notification')->where('user_id', $this->u($r))->where('is_read', 0)->update(['is_read' => 1, 'read_at' => now()]);

        return response()->json(['message' => 'Đã đánh dấu tất cả đã đọc.']);
    }
}
