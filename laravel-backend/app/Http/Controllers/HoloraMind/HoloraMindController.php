<?php

namespace App\Http\Controllers\HoloraMind;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HoloraMindController extends Controller
{
    private function mockResponse(string $message): string
    {
        $msg = mb_strtolower($message);
        if (str_contains($msg, 'xin chào') || str_contains($msg, 'hello')) {
            return 'Xin chào! Tôi là MeDecode AI, trợ lý AI thông minh từ MeDecode. Tôi có thể giúp gì cho bạn hôm nay?';
        }
        if (str_contains($msg, 'triệu chứng') || str_contains($msg, 'bệnh')) {
            return 'Bạn đang lo lắng về sức khỏe sao? Hãy mô tả chi tiết triệu chứng của bạn để tôi có thể hỗ trợ tư vấn sơ bộ (Lưu ý: Tôi không thay thế hoàn toàn bác sĩ).';
        }
        if (str_contains($msg, 'lịch hẹn') || str_contains($msg, 'tư vấn')) {
            return "Để đặt lịch hẹn hoặc tư vấn, bạn hãy truy cập vào mục 'Đặt Lịch' trên Navbar của MeDecode nhé.";
        }

        return 'Tôi đã ghi nhận nội dung của bạn. Đây là một thông tin quan trọng. Bạn có muốn đi sâu vào chi tiết nào không? (Tôi đang trong giai đoạn phát triển và sẽ sớm thông minh hơn!)';
    }

    public function chats(Request $request)
    {
        $userId = $request->attributes->get('legacy_auth_user')->id;
        try {
            return response()->json(DB::table('holora_mind_chats')->where('user_id', $userId)->whereNull('deleted_at')->orderByDesc('updated_at')->get());
        } catch (\Throwable $exception) {
            return response()->json(['error' => $exception->getMessage()], 500);
        }
    }

    public function messages($chatId)
    {
        try {
            return response()->json(DB::table('holora_mind_messages')->where('chat_id', $chatId)->orderBy('created_at')->get());
        } catch (\Throwable $exception) {
            return response()->json(['error' => $exception->getMessage()], 500);
        }
    }

    public function send(Request $request)
    {
        $userId = $request->attributes->get('legacy_auth_user')->id;
        $content = $request->input('content');
        if (! $content) {
            return response()->json(['message' => 'Nội dung tin nhắn trống!'], 400);
        }

        try {
            $chatId = $request->input('chatId');
            if (! $chatId) {
                $chatId = DB::table('holora_mind_chats')->insertGetId(['user_id' => $userId]);
            }

            DB::table('holora_mind_messages')->insert([
                'chat_id' => $chatId,
                'role' => 'user',
                'content' => $content,
            ]);

            DB::table('holora_mind_chats')
                ->where('id', $chatId)
                ->where('title', 'Cuộc trò chuyện mới')
                ->update(['title' => mb_substr($content, 0, 30), 'updated_at' => now()]);

            $aiContent = $this->mockResponse($content);
            DB::table('holora_mind_messages')->insert([
                'chat_id' => $chatId,
                'role' => 'assistant',
                'content' => $aiContent,
            ]);

            return response()->json([
                'chat_id' => $chatId,
                'user_message' => $content,
                'ai_message' => $aiContent,
            ]);
        } catch (\Throwable $exception) {
            return response()->json(['error' => $exception->getMessage()], 500);
        }
    }
}
