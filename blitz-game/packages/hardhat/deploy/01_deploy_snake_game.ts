import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploySnakeGame: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("SnakeGame", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deploySnakeGame;

deploySnakeGame.tags = ["SnakeGame"];
