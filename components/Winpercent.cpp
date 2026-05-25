#include <cmath>
#include <emscripten/emscripten.h>

extern "C" {

EMSCRIPTEN_KEEPALIVE
int calculateRequiredWins(int win, int lose, double targetPercent)
{
    if (win + lose == 0)
        return 0;

    double currentPercent =
        (double)win / (win + lose) * 100.0;

    if (targetPercent <= currentPercent)
        return 0;

    if (targetPercent >= 100.0)
        return -1;

    double target = targetPercent / 100.0;

    double required_games =
        (target * (win + lose) - win)
        / (1.0 - target);

    return (int)std::ceil(required_games);
}

}
