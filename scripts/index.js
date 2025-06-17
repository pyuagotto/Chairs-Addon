//@ts-check
import { CommandPermissionLevel, CustomCommandOrigin, CustomCommandStatus, Player, system, world } from '@minecraft/server';
import { MinecraftDimensionTypes } from "./lib/index.js";

const dimensions = [
    MinecraftDimensionTypes.Overworld,
    MinecraftDimensionTypes.Nether,
    MinecraftDimensionTypes.TheEnd,
];

/**
 * 
 * @param {CustomCommandOrigin} origin 
 * @returns {{ status: CustomCommandStatus, message?: string} | undefined }
 */
const sit = function(origin){
    if(origin.sourceEntity instanceof Player){
        const player = origin.sourceEntity;

        if(!player.getComponent("riding")){
            if(player.isOnGround){
                system.run(()=>{
                    const chair = player.dimension.spawnEntity("pyuagotto:chairs", player.location);
                    chair.getComponent("minecraft:rideable")?.addRider(player);
                });
            }else{
                return { status: CustomCommandStatus.Failure, message: `空中で座ることはできません！` };
            }
            
        }else{
            return { status: CustomCommandStatus.Failure, message: `すでに乗り物に乗っています！` };
        }
    }else{
        return { status: CustomCommandStatus.Failure, message: `このコマンドはプレイヤー以外に対して実行できません` };
    }
}

//誰も座っていない "pyuagotto:chairs"を削除
system.runInterval(()=>{
    for(const dimension of dimensions){
        for(const chair of world.getDimension(dimension).getEntities({ type: "pyuagotto:chairs" })){
            const riders = chair.getComponent("minecraft:rideable")?.getRiders();
    
            if(riders?.length == 0) chair.remove();
        }
    }
});

world.beforeEvents.playerInteractWithBlock.subscribe((ev)=>{
    const { block, player, itemStack, isFirstEvent } = ev;
    
    if(player.getComponent("riding") || player.isSneaking || !player.isOnGround || itemStack) return;
    const { permutation } = block;
    const direction = permutation.getState("weirdo_direction");

    const east = block.east();
    const west = block.west();
    const north = block.north();
    const south = block.south();

    if(!block.typeId.includes("_stairs") || block.above()?.typeId !== "minecraft:air" || permutation.getState("upside_down_bit")) return;

    if(east?.typeId.includes("_stairs") && !east?.permutation.getState("upside_down_bit")){
        const eastDirection = east?.permutation.getState("weirdo_direction");

        switch(direction){
            case 0:
                if(eastDirection === 2 || eastDirection === 3) return;
                break;

            case 1:
                if(eastDirection === 2 || eastDirection === 3) return;
                break;
        }
    }

    if(west?.typeId.includes("_stairs") && !west?.permutation.getState("upside_down_bit")){
        const westDirection = west?.permutation.getState("weirdo_direction");

        switch(direction){
            case 0:
                if(westDirection === 2 || westDirection === 3) return;
                break;

            case 1:
                if(westDirection === 2 || westDirection === 3) return;
                break;
        }
    }

    if(north?.typeId.includes("_stairs") && !north?.permutation.getState("upside_down_bit")){
        const northDirection = north?.permutation.getState("weirdo_direction");

        switch(direction){
            case 2:
                if(northDirection === 0 || northDirection === 1) return;
                break;

            case 3:
                if(northDirection === 0 || northDirection === 1) return;
                break;
        }
    }

    if(south?.typeId.includes("_stairs") && !south?.permutation.getState("upside_down_bit")){
        const southDirection = south?.permutation.getState("weirdo_direction");

        switch(direction){
            case 2:
                if(southDirection === 0 || southDirection === 1) return;
                break;

            case 3:
                if(southDirection === 0 || southDirection === 1) return;
                break;
        }
    }

    if(isFirstEvent){
        system.run(()=>{
            const chair = player.dimension.spawnEntity("pyuagotto:chairs", block.center());
            let rotation = { x: 0, y: 0 };
            
            switch(permutation.getState("weirdo_direction")){
                case 0:
                    rotation = { x: 0, y: 90 };
                    break;
    
                case 1:
                    rotation = { x: 0, y: 270 };
                    break;
    
                case 2:
                    rotation = { x: 0, y: 180 };
                    break;
    
                case 3:
                    rotation = { x: 0, y: 0 };
                    break;
            };
    
            chair.setRotation(rotation);
            chair.getComponent("minecraft:rideable")?.addRider(player);
        });
    }
});

system.beforeEvents.startup.subscribe((ev) => {
    /**
     * 
     * @param {string} name 
     * @param {string} description 
     * @param {(origin: CustomCommandOrigin) => { status: CustomCommandStatus, message?: string } | undefined} callback 
     */
    const registerCommand = function(name, description, callback) {
        ev.customCommandRegistry.registerCommand(
            {
                name,
                description,
                permissionLevel: CommandPermissionLevel.Any,
            },
            callback
        );
    };

    registerCommand(
        "chairs:sit",
        "その場に座ります",
        sit
    );
});

