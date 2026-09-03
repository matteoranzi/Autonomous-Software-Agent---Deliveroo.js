(define (problem deliveroo-pathfinding)
(:domain default)

(:objects
    player - sokoban

    crate1 - crate

    ; TILES (named tile_<x>_<y> to trace back to the original grid coordinates -
    ; only walkable cells get an object; '.' cells in the map below simply
    ; have no corresponding tile object at all)
    tile_0_0 - tile
    tile_1_0 - tile
    tile_3_0 - tile

    tile_0_1 - tile
    tile_2_1 - tile
    tile_3_1 - tile
    tile_4_1 - tile

    tile_0_2 - tile
    tile_1_2 - tile
    tile_3_2 - tile
    tile_4_2 - tile

    tile_0_3 - tile
    tile_1_3 - tile
    tile_2_3 - tile
    tile_3_3 - tile
)

; ================================================
; MAP (bottom-left origin, x increases rightward, y increases upward)
;
; 3    f    f    f    f    .
; 2    f    f    .    C|ac  f
; 1    f    .    ac   ac    f
; 0    A    f    .    O     .
; y/x  0    1    2    3     4
;
; f: free-tile              ac: crates-allowed-tile
; C: crate (on tile_3_2, which is also an ac tile)
; A: agent start (tile_0_0) O: agent's goal tile (tile_3_0)
; .: not part of the grid (no tile object, no adjacency)
; ================================================

(:init
    (on player tile_0_0)
    (on crate1 tile_3_2)

    ; --- crates-allowed tiles (static; independent of current occupancy) ---
    (crates-allowed-tile tile_3_2)
    (crates-allowed-tile tile_2_1)
    (crates-allowed-tile tile_3_1)

    ; --- free tiles (walkable and currently unoccupied) ---
    (free-tile tile_1_0)
    (free-tile tile_3_0)

    (free-tile tile_0_1)
    (free-tile tile_2_1)
    (free-tile tile_3_1)
    (free-tile tile_4_1)

    (free-tile tile_0_2)
    (free-tile tile_1_2)
    (free-tile tile_4_2)

    (free-tile tile_0_3)
    (free-tile tile_1_3)
    (free-tile tile_2_3)
    (free-tile tile_3_3)


; ================================================
; GAME GRID (adjacency only between walkable tiles - '.' cells are skipped)
; ================================================

    ; --- up / down ---
    (adjacent-up tile_0_0 tile_0_1)
    (adjacent-down tile_0_1 tile_0_0)
    (adjacent-up tile_0_1 tile_0_2)
    (adjacent-down tile_0_2 tile_0_1)
    (adjacent-up tile_0_2 tile_0_3)
    (adjacent-down tile_0_3 tile_0_2)

    (adjacent-up tile_1_2 tile_1_3)
    (adjacent-down tile_1_3 tile_1_2)

    (adjacent-up tile_3_0 tile_3_1)
    (adjacent-down tile_3_1 tile_3_0)
    (adjacent-up tile_3_1 tile_3_2)
    (adjacent-down tile_3_2 tile_3_1)
    (adjacent-up tile_3_2 tile_3_3)
    (adjacent-down tile_3_3 tile_3_2)

    (adjacent-up tile_4_1 tile_4_2)
    (adjacent-down tile_4_2 tile_4_1)

    ; --- left / right ---
    (adjacent-right tile_0_0 tile_1_0)
    (adjacent-left tile_1_0 tile_0_0)

    (adjacent-right tile_2_1 tile_3_1)
    (adjacent-left tile_3_1 tile_2_1)
    (adjacent-right tile_3_1 tile_4_1)
    (adjacent-left tile_4_1 tile_3_1)

    (adjacent-right tile_0_2 tile_1_2)
    (adjacent-left tile_1_2 tile_0_2)
    (adjacent-right tile_3_2 tile_4_2)
    (adjacent-left tile_4_2 tile_3_2)

    (adjacent-right tile_0_3 tile_1_3)
    (adjacent-left tile_1_3 tile_0_3)
    (adjacent-right tile_1_3 tile_2_3)
    (adjacent-left tile_2_3 tile_1_3)
    (adjacent-right tile_2_3 tile_3_3)
    (adjacent-left tile_3_3 tile_2_3)
)

(:goal (on player tile_3_0))

; (:metric minimize (total-distance))

)